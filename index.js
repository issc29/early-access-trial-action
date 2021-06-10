const core = require('@actions/core');
const github = require('@actions/github');
const dedent = require('dedent');

const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const scRequestedLabledID = core.getInput('requestedLabelID');
const shipped = core.getInput('shipped');
const payload = github.context.payload
const issueID = payload.client_payload.command.resource.id

const functionsLib = require('actions-api-functions');
var functions = new functionsLib(octokit, core)

run();

async function run() {
  if(shipped == 'true') {
    commentIfShipped(issueID, shipped, payload.client_payload.data)
    return
  }
  
  try {

    // Add Comment to current Issue
    const currentIssueComment = getCurrentIssueComment(payload.client_payload.data)
    await functions.commentOnIssue(issueID, currentIssueComment)

    // Add Label to current Issue
   await functions.addLabelToIssue(issueID, scRequestedLabledID)

    //Get Issue Title
    const issueInfo = await functions.getIssueInfo(issueID)
    const requestedIssueID = core.getInput('requestedIssueID')

    // Add Comment to Requested Issue
    const requestIssueComment = getRequestIssueComment(issueInfo)
    await functions.commentOnIssue(requestedIssueID, requestIssueComment)

  } catch (error) {
    core.setFailed(error.message);
  }
}


function getCurrentIssueComment(payloadData){
  return dedent`
    Early Access Name: ${payloadData['Early Access Name']}
    * Is this an existing customer or prospect? ${payloadData['Briefed of Functionality?']}
    * Have they been briefed on the functionality of ${payloadData['Early Access Name']} today? ${payloadData['Existing GHAS Customer?']}
    * Is ${payloadData['Early Access Name']} a critical need? ${payloadData['Critical to POC?']}
    * Are they willing to provide feedback for this Beta? ${payloadData['Feedback']}
    * Comments: ${payloadData['Comments']}
    
    Next steps: Needs approval by @niroshan or @issc29`
}

function getRequestIssueComment(issueInfo){
  return dedent`
    New Early Access Request: ${issueInfo.title} #${issueInfo.number}`
}

async function commentIfShipped(issueID, shipped, payloadData) {
    const shippedComment = getShippedComment(payloadData)
    await functions.commentOnIssue(issueID, shippedComment)
}

function getShippedComment(payloadData){
  return dedent`${payloadData['Early Access Name']} has shipped and is currently available!`
}

