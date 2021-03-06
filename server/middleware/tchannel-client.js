'use strict'

const
  TChannelAsThrift = require('tchannel/as/thrift'),
  TChannel = require('tchannel'),
  path = require('path'),
  Long = require('long'),
  moment = require('moment'),
  dns = require('dns'),
  isIPv4 = require('is-ipv4-node')

function transform(item) {
  if (!item || typeof item !== 'object') return item

  Object.entries(item).forEach(([subkey, subvalue]) => {
    if (subvalue && typeof subvalue.unsigned === 'boolean') {
      item[subkey] = Long.fromValue(item[subkey]).toNumber()
      var m = moment(item[subkey] / 1000000)
      if (m.isValid() && m.isAfter('2017-01-01')) {
        item[subkey] = m.toISOString()
      }
    } else if (Buffer.isBuffer(subvalue)) {
      if (subkey === 'nextPageToken') {
        item.nextPageToken = subvalue.toString('base64')
        return
      }

      let stringval = subvalue.toString('utf8')
      try {
        // most of Cadence's uses of buffer is just line-delimited JSON.
        item[subkey] = stringval.split('\n').filter(x => x).map(JSON.parse)
        if (item[subkey].length === 1) {
          item[subkey] = item[subkey][0]
        }
      } catch(e) {
        item[`${subkey}_base64`] = subvalue.toString('base64')
        item[subkey] = stringval
      }
    } else if (Array.isArray(subvalue)) {
      subvalue.forEach(transform)
    } else if (subvalue && typeof subvalue === 'object') {
      transform(subvalue)
    }
  })
  return item
}

const lookupAsync = host => new Promise(function (resolve, reject) {
  dns.lookup(host, { family: 4 }, function (err, ip) {
    if (err) {
      reject(err)
    } else {
      resolve(ip)
    }
  })
})

const peers = process.env.CADENCE_TCHANNEL_PEERS ?
  process.env.CADENCE_TCHANNEL_PEERS.split(',') :
  ['127.0.0.1:7933']

async function makeChannel(client) {
  var ipPeers = await Promise.all(peers.map(peer => {
    var [host, port] = peer.split(':')
    if (!isIPv4(host)) {
      return lookupAsync(host).then(ip => [ip, port].join(':'))
    } else {
      return peer
    }
  }))

  return client.makeSubChannel({
    serviceName: 'cadence-frontend',
    peers: ipPeers
  })
}

module.exports = async function(ctx, next) {
  const
    client = TChannel(),
    cadenceChannel = await makeChannel(client),
    tchannelAsThrift = TChannelAsThrift({
      channel: cadenceChannel,
      entryPoint: path.join(__dirname, '../idl/cadence.thrift')
    })

  function req(method, reqName, bodyTransform) {
    return (body) => new Promise(function(resolve, reject) {
      try {
        tchannelAsThrift.request({
          serviceName: process.env.CADENCE_TCHANNEL_SERVICE || 'cadence-frontend',
          headers: {
            cn: 'cadence-web'
          },
          hasNoParent: true,
          timeout: 1000 * 60 * 5,
          retryFlags: { onConnectionError: true },
          retryLimit: Number(process.env.CADENCE_TCHANNEL_RETRY_LIMIT || 3)
        }).send(`WorkflowService::${method}`, {}, {
          [`${reqName ? reqName + 'R' : 'r'}equest`]: typeof bodyTransform === 'function' ? bodyTransform(body) : body
        }, function (err, res) {
          try {
            if (err) {
              reject(err)
            } else if (res.ok) {
              resolve(transform(res.body))
            } else {
              ctx.throw(res.typeName === 'entityNotExistError' ? 404 : 400, null, res.body || res)
            }
          } catch (e) {
            reject(e)
          }
        })
      } catch(e) {
        reject(e)
      }
    })
  }

  const withDomainPaging = body => Object.assign({
    domain: ctx.params.domain,
    maximumPageSize: 100
  }, body),
  withWorkflowExecution = body => Object.assign({
    domain: ctx.params.domain,
    execution: {
      workflowId: ctx.params.workflowId,
      runId: ctx.params.runId
    },
  }, body)

  ctx.cadence = {
    openWorkflows: req('ListOpenWorkflowExecutions', 'list', withDomainPaging),
    closedWorkflows: req('ListClosedWorkflowExecutions', 'list', withDomainPaging),
    getHistory: req('GetWorkflowExecutionHistory', 'get', b => Object.assign(withDomainPaging(b), withWorkflowExecution(b))),
    describeWorkflow: req('DescribeWorkflowExecution', 'describe', withWorkflowExecution),
    queryWorkflow: req('QueryWorkflow', 'query', withWorkflowExecution),
    describeDomain: req('DescribeDomain', 'describe'),
    describeTaskList: req('DescribeTaskList'),
  }

  try {
    await next()
    client.close()
  } catch (e) {
    client.close()
    throw e
  }
}