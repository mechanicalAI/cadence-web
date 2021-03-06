import Router from 'vue-router'
import Vue from 'vue'
import moment from 'moment'
import fetchMock from 'fetch-mock'
import qs from 'friendly-querystring'

import main from '../main'
import http from '../http'
import fixtures from './fixtures'


export default function Scenario(test) {
  test.scenario = this
  this.mochaTest = test
  this.api = fetchMock.sandbox().catch(function(url, req, opts) {
    var msg = `Unexpected request: ${url}${opts && opts.query ? '?' + opts.query : ''}`
    if (req.body) {
      msg += '\n' + req.body
    }
    mocha.throwError(new Error(msg))
  })
}

Scenario.prototype.isDebuggingJustThisTest = function() {
  return window.location.search.includes(encodeURIComponent(this.mochaTest.fullTitle()))
}

Scenario.prototype.render = function(attachToBody) {
  var $http = http.bind(null, this.api)
  $http.post = http.post.bind(null, this.api)

  this.router = new Router(Object.assign({}, main.routeOpts, { mode: 'abstract' }))
  this.router.push(this.initialUrl || '/')

  var el = document.createElement('div')
  if (attachToBody || this.isDebuggingJustThisTest()) {
    document.body.appendChild(el)
  }

  this.vm = new Vue({
    // vue just throws this away, not sure why
    el,
    router: this.router,
    template: '<App/>',
    components: { App: main.App },
    mixins: [{
      created: function() {
        this.$http = $http
      }
    }]
  })

  return this.vm.$el
}

Scenario.prototype.go = function() {
  return [this.render.apply(this, arguments), this]
}

Scenario.prototype.startingAt = function(url) {
  this.initialUrl = url
  return this
}

Scenario.prototype.tearDown = function() {
  if (this.vm && this.vm.$el && this.vm.$el.parentElement
    // as a convience, if debugging just this test, don't remove the test app
    && !this.isDebuggingJustThisTest()) {
    this.vm.$el.parentElement.removeChild(this.vm.$el)
  }

  var { unmatched } = this.api.calls()
  return unmatched.length ?
    Promise.reject(new Error(`${unmatched.length} outstanding expected API calls:
      ${unmatched.slice(0,5).map(([url]) => url).join('\n')}`)) :
    Promise.resolve()
}

Object.defineProperty(Scenario.prototype, 'location', {
  get: function() {
    return this.router.history.getCurrentLocation()
  }
})

Scenario.prototype.withDomain = function(domain) {
  this.domain = domain
  return this
}

Scenario.prototype.withWorkflows = function(status, query, workflows) {
  if (!workflows) {
    workflows = JSON.parse(JSON.stringify(fixtures.workflows[status]))
  }

  var url = `/api/domain/${this.domain}/workflows/${status}?${qs.stringify(Object.assign({
      startTime: moment().startOf('minute').subtract(1, 'day').toISOString(),
      endTime: moment().startOf('minute').toISOString(),
    }, query))}`

  var response = Array.isArray(workflows) ? { executions: workflows } : workflows

  this.api.getOnce(url, response)

  return this
}

Scenario.prototype.execApiBase = function(workflowId, runId) {
  return `/api/domain/${this.domain}/workflows/${encodeURIComponent(workflowId)}/${encodeURIComponent(runId)}`
}

Scenario.prototype.withExecution = function(workflowId, runId, description)  {
  this.api.getOnce(this.execApiBase(workflowId, runId), Object.assign({
    executionConfiguration: {
      taskList: { name: 'ci_task_list' },
      executionStartToCloseTimeoutSeconds: 3600,
      taskStartToCloseTimeoutSeconds: 10,
      childPolicy: 'TERMINATE'
    },
    workflowExecutionInfo: {
      execution: { workflowId, runId },
      type: { name: 'CIDemoWorkflow' },
      startTime: moment().startOf('hour').subtract(2, 'minutes'),
      historyLength: 14
    }
  }, description || {}))
  return this
}

Scenario.prototype.withSummaryInput = function(workflowId, runId, input)  {
  this.api.getOnce(`${this.execApiBase(workflowId, runId)}/history`, {
    history: {
      events: [{
        eventType: 'WorkflowExecutionStarted',
        details: { input }
      }]
    }
  })
  return this
}

Scenario.prototype.withHistory = function(workflowId, runId, events, hasMorePages)  {
  if (!events) {
    events = JSON.parse(JSON.stringify(fixtures.history.emailRun1))
  }
  if (!this.historyNpt) {
    this.historyNpt = {}
  }

  const makeToken = () => btoa(JSON.stringify({ NextEventId: this.historyNpt[runId], IsWorkflowRunning: true }))

  var url = `${this.execApiBase(workflowId, runId)}/history?waitForNewEvent=true`,
      response = Array.isArray(events) ? { history: { events } } : events

  if (this.historyNpt[runId]) {
    url += `&nextPageToken=${encodeURIComponent(makeToken())}`
  }

  if (hasMorePages) {
    this.historyNpt[runId] = (this.historyNpt[runId] || 0) + response.history.events.length + 1
    response.nextPageToken = makeToken()
  }

  this.api.getOnce(url, response)

  return this
}

window.Scenario = Scenario