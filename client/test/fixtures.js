import moment from 'moment'

const timeBasis = moment().startOf('day').add(5, 'hours'),
  emailRun1Start = moment(timeBasis).subtract(3, 'minutes').subtract(1, 'day'),
  exampleTimeoutStart = moment(timeBasis).subtract(2, 'hours')

export default {
  timeBasis,
  workflows: {
    open: [{
      execution: {
        workflowId: 'github.com/uber/cadence-web/email-daily-summaries-2',
        runId: 'ef2c889e-e709-4d50-99ee-3748dfa0a101'
      },
      type: {
        name: 'email-daily-summaries'
      },
      startTime: moment(timeBasis).subtract(3, 'minutes').toISOString(),
    }, {
      execution: {
        workflowId: 'github.com/uber/cadence-web/example-1',
        runId: 'db8da3c0-b7d3-48b7-a9b3-b6f566e58207'
      },
      type: {
        name: 'example'
      },
      startTime: moment(timeBasis).subtract(20, 'seconds').toISOString(),
    }],
    closed: [{
      execution: {
        workflowId: 'email-daily-summaries',
        runId: '51ccc0d1-6ffe-4a7a-a89f-6b5154df86f7'
      },
      type: {
        name: 'github.com/uber/cadence-web/email-daily-summaries-1'
      },
      closeStatus: 'COMPLETED',
      startTime: emailRun1Start.toISOString(),
      closeTime: moment(timeBasis).subtract(2, 'minutes').subtract(1, 'day').toISOString(),
    }]
  },
  history: {
    emailRun1: [
      {
        timestamp: emailRun1Start.toISOString(),
        eventType: 'WorkflowExecutionStarted',
        eventId: 1,
        details: {
          workflowType: {
            name: 'email-daily-summaries'
          },
          taskList: {
            name: 'ci-task-queue'
          },
          input:[839134, { env: "prod" }],
          executionStartToCloseTimeoutSeconds: 360,
          taskStartToCloseTimeoutSeconds: 180
        }
      }, {
        timestamp: emailRun1Start.toISOString(),
        eventType: 'DecisionTaskScheduled',
        eventId: 2,
        details: {
          taskList: {
            name: 'ci-task-queue'
          }
        }
      }, {
        timestamp: emailRun1Start.toISOString(),
        eventType: 'DecisionTaskStarted',
        eventId: 3,
        details: {
          scheduledEventId: 2,
          question: 'What is the answer to life, the universe, and everything?',
          requestId: 'abefc8d3-c654-49e6-8e17-126847bf315f'
        }
      }, {
        timestamp: emailRun1Start.add(1, 'second').toISOString(),
        eventType: 'DecisionTaskCompleted',
        eventId: 4,
        details: {
          scheduledEventId: 2,
          startedEventId: 3,
          answer: 42
        }
      }, {
        timestamp: emailRun1Start.add(1, 'second').toISOString(),
        eventType: 'MarkerRecorded',
        eventId: 5,
        details: {
          markerName: 'Version',
          details: 'initial version\n2',
          decisionTaskCompletedEventId: 4
        }
      }, {
        timestamp: emailRun1Start.add(1, 'second').toISOString(),
        eventType: 'ActivityTaskScheduled',
        eventId: 6,
        details: {
          activityId: '0',
          activityType: {
            name: 'send-emails'
          },
          taskList: {
            name: 'ci-task-queue'
          },
          input: [12345, ["bob@example.com", "jane@somewhere.com"]],
          scheduleToCloseTimeoutSeconds: 360,
          scheduleToStartTimeoutSeconds: 180,
          startToCloseTimeoutSeconds: 180,
          heartbeatTimeoutSeconds: 0,
          decisionTaskCompletedEventId: 4
        }
      }, {
        timestamp: emailRun1Start.add(5, 'second').toISOString(),
        eventType: 'ActivityTaskStarted',
        eventId: 7,
        details: {
          scheduledEventId: 6,
          requestId: '13624219-683c-401e-a321-db04cdac724a'
        }
      }, {
        timestamp: emailRun1Start.add(11, 'second').toISOString(),
        eventType: 'ActivityTaskCompleted',
        eventId: 8,
        details: {
          result: '{IntVal:9223372036854775807,IntPtrVal:9223372036854775807,FloatVal:1.7976931348623157e+308,StringVal:canary_echo_test,StringPtrVal:canary_echo_test,SliceVal:[canary,.,echoWorkflow],MapVal:{us-east-1:dca1a,us-west-1:sjc1a}}',
          scheduledEventId: 6,
          startedEventId: 7,
        }
      }, {
        timestamp: emailRun1Start.add(11, 'second').toISOString(),
        eventType: 'DecisionTaskScheduled',
        eventId: 9,
        details: {}
      }, {
        timestamp: emailRun1Start.add(11, 'second').toISOString(),
        eventType: 'DecisionTaskStarted',
        eventId: 10,
        details: {
          scheduledEventId: 9,
          foo: 'bar'
        }
      }, {
        timestamp: emailRun1Start.add(11, 'second').toISOString(),
        eventType: 'DecisionTaskCompleted',
        eventId: 11,
        details: {
          scheduledEventId: 9,
          startedEventId: 10
        }
      }, {
        timestamp: emailRun1Start.add(12, 'second').toISOString(),
        eventType: 'WorkflowExecutionCompleted',
        eventId: 12,
        details: {
          result: 'emails sent',
          decisionTaskCompletedEventId: 11
        }
      }
    ],
    exampleTimeout: [
      {
        details: {
          executionStartToCloseTimeoutSeconds: 360,
          taskList: {
            name: 'canary-task-queue'
          },
          taskStartToCloseTimeoutSeconds: 180,
          workflowType: {
            name: 'example'
          }
        },
        eventId: 1,
        eventType: 'WorkflowExecutionStarted',
        timestamp: exampleTimeoutStart.toISOString()
      },
      {
        eventId: 2,
        eventType: 'DecisionTaskScheduled',
        timestamp: exampleTimeoutStart.toISOString()
      },
      {
        details: {
          scheduledEventId: 2
        },
        eventId: 3,
        eventType: 'DecisionTaskStarted',
        timestamp: exampleTimeoutStart.toISOString()
      },
      {
        details: {
          scheduledEventId: 2,
          startedEventId: 3
        },
        eventId: 4,
        eventType: 'DecisionTaskCompleted',
        timestamp: exampleTimeoutStart.toISOString()
      },
      {
        details: {
          decisionTaskCompletedEventId: 4
        },
        eventId: 5,
        eventType: 'MarkerRecorded',
        timestamp: exampleTimeoutStart.toISOString()
      },
      {
        details: {
          activityId: '0',
          activityType: {
            name: 'activity.timeout'
          },
          decisionTaskCompletedEventId: 4,
          heartbeatTimeoutSeconds: 0,
          scheduleToCloseTimeoutSeconds: 2,
          scheduleToStartTimeoutSeconds: 1,
          startToCloseTimeoutSeconds: 1,
          taskList: {
            name: 'ci-task-queue'
          }
        },
        eventId: 6,
        eventType: 'ActivityTaskScheduled',
        timestamp: exampleTimeoutStart.add(1, 'second').toISOString()
      },
      {
        details: {
          requestId: '71e3bef1-d6db-4ce1-b705-cf81732a6faf',
          scheduledEventId: 6
        },
        eventId: 7,
        eventType: 'ActivityTaskStarted',
        timestamp: exampleTimeoutStart.add(1, 'second').toISOString()
      },
      {
        details: {
          scheduledEventId: 6,
          startedEventId: 7,
          timeoutType: 'START_TO_CLOSE'
        },
        eventId: 8,
        eventType: 'ActivityTaskTimedOut',
        timestamp: exampleTimeoutStart.add(2, 'second').toISOString()
      },
      {
        details: {
          startToCloseTimeoutSeconds: 180,
          taskList: {
            name: 'compute3330-sjc1:43b62b8e-aa2a-4b58-9571-39062a073d24'
          }
        },
        eventId: 9,
        eventType: 'DecisionTaskScheduled',
        timestamp: exampleTimeoutStart.add(2, 'second').toISOString()
      },
      {
        details: {
          scheduledEventId: 9
        },
        eventId: 10,
        eventType: 'DecisionTaskStarted',
        timestamp: exampleTimeoutStart.add(2, 'second').toISOString()
      },
      {
        details: {
          executionContext: null,
          scheduledEventId: 9,
          startedEventId: 10
        },
        eventId: 11,
        eventType: 'DecisionTaskCompleted',
        timestamp: exampleTimeoutStart.add(2, 'second').toISOString()
      },
      {
        details: {
          decisionTaskCompletedEventId: 11,
          result: null
        },
        eventId: 12,
        eventType: 'WorkflowExecutionCompleted',
        timestamp: exampleTimeoutStart.add(2, 'second').toISOString()
      }
    ]
  }
}