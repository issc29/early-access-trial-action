const core = require('@actions/core');
const github = require('@actions/github');
const dedent = require('dedent');

const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const scRequestedLabledID = core.getInput('requestedLabelID');
const payload = github.context.payload
const issueID = payload.client_payload.command.resource.id
  

run();

async function run() {

  try {

    // Add Comment to current Issue
    const currentIssueComment = getCurrentIssueComment(payload.client_payload.data)
    await commentOnIssue(issueID, currentIssueComment)

    // Add Label to current Issue
   await addLabelToIssue(issueID, scRequestedLabledID)

    //Get Issue Title
    const issueInfo = await getIssueInfo(issueID)
    const requestedIssueID = core.getInput('requestedIssueID')

    // Add Comment to Requested Issue
    const requestIssueComment = getRequestIssueComment(issueInfo)
    await commentOnIssue(requestedIssueID, requestIssueComment)

  } catch (error) {
    core.setFailed(error.message);
  }
}


function getCurrentIssueComment(payloadData){
  return dedent`
    Early Access Name: ${payloadData['Early Access Name']}
    * Is this an existing customer or prospect? ${payloadData['Briefed of Functionality?']}
    * [Prospect] Have they been briefed on the functionality of Security Center today? ${payloadData['Existing GHAS Customer?']}
    * [Prospect] Is Security Center critical to the success of the POC? ${payloadData['Critical to POC?']}
    * [Prospect] Comments: ${payloadData['Comments']}
    
    Next steps: Needs approval by @niroshan or @issc29`
}

function getRequestIssueComment(issueInfo){
  return dedent`
    New Early Access Request: ${issueInfo.title} #${issueInfo.number}`
}

async function commentOnIssue(issueID, comment) {
  const addCommentMutation = `mutation addComment($issueId: ID!, $commentBody: String!){ 
    addComment(input:{subjectId: $issueId , body: $commentBody}) {
      commentEdge {
        node {
          id
        }
      }
      }
    }`;

  const variables = {
    issueId: issueID,
    commentBody: comment,
  }
  const result = await octokit.graphql(addCommentMutation, variables)
  if (!result) {
    core.setFailed('GraphQL request failed')
  } 

  return result
}


async function getIssueInfo(issueID) {
  const getIssueInfoQuery = `query($issueId: ID!) { 
    node(id:$issueId) {
      ... on Issue {
        title,
        number
      }
    }
  }`;

  const variables = {
    issueId: issueID
  }
  const result = await octokit.graphql(getIssueInfoQuery, variables)
  if (!result) {
    core.setFailed('GraphQL request failed')
  } 
  else {
    console.log(`Title: ${result.node.title}`)
  } 
  return result.node
}

async function addLabelToIssue(issueID, labelID) {
  const addLabelMutation = `mutation addLabel($issueId: ID!, $labelId: [ID!]!){ 
    addLabelsToLabelable(input:{labelIds:$labelId, labelableId:$issueId}){
      labelable {
        ... on Issue {
          id
        }
      }
    }
  }`;

  const variables = {
    issueId: issueID,
    labelId: labelID
  }
  const result = await octokit.graphql(addLabelMutation, variables)
  if (!result) {
    core.setFailed('GraphQL request failed')
  } 
  else {
    console.log(`Added Label: nodeId: ${result.addLabelsToLabelable.labelable.id}`)
  } 
  return result.addLabelsToLabelable.labelable
}