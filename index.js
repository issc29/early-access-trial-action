const core = require('@actions/core');
const github = require('@actions/github');
const dedent = require('dedent');

const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const scRequestedLabledID = core.getInput('requestedLabelID');
const payload = github.context.payload
const issueID = payload.client_payload.command.resource.id
  
const addCommentMutation = `mutation addComment($issueId: ID!, $commentBody: String!){ 
  addComment(input:{subjectId: $issueId , body: $commentBody}) {
    commentEdge {
      node {
        id
      }
    }
    }
  }`;
  
  const addLabelMutation = `mutation addLabel($issueId: ID!, $labelId: [ID!]!){ 
  addLabelsToLabelable(input:{labelIds:$labelId, labelableId:$issueId}){
    labelable {
      ... on Issue {
        id
      }
    }
  }
}`;

const getIssueInfo = `query($issueId: ID!) { 
  node(id:$issueId) {
    ... on Issue {
      title,
      number
    }
  }
}`;


run();

async function run() {

  const comment = dedent`
    Early Access Name: ${payload.client_payload.data['Early Access Name']}
    * Is this an existing customer or prospect? ${payload.client_payload.data['Briefed of Functionality?']}
    * [Prospect] Have they been briefed on the functionality of Security Center today? ${payload.client_payload.data['Existing GHAS Customer?']}
    * [Prospect] Is Security Center critical to the success of the POC? ${payload.client_payload.data['Critical to POC?']}
    * [Prospect] Comments: ${payload.client_payload.data['Comments']}
    
    Next steps: Needs approval by @niroshan or @issc29`

  try {

    // Add Comment to current Issue
    const commentVariables = {
      issueId: issueID,
      commentBody: comment,
    }
    const commentResult = await octokit.graphql(addCommentMutation, commentVariables)
    if (!commentResult) {
      core.setFailed('GraphQL request failed')
    } 
    else {
      console.log(`Added Comment to Issue nodeId: ${commentResult.addComment.commentEdge.node.id}`)
    } 

    // Add Label to current Issue
    const labelVariables = {
      issueId: issueID,
      labelId: scRequestedLabledID
    }
    const labelResult = await octokit.graphql(addLabelMutation, labelVariables)
    if (!labelResult) {
      core.setFailed('GraphQL request failed')
    } 
    else {
      console.log(`Added Label to Issue: issueID, nodeId: ${labelResult.addLabelsToLabelable.labelable.id}`)
    } 

    //Get Issue Title
    const getIssueInfoVariables = {
      issueId: issueID
    }
    const getIssueInfoResult = await octokit.graphql(getIssueInfo, getIssueInfoVariables)
    if (!getIssueInfoResult) {
      core.setFailed('GraphQL request failed')
    } 
    else {
      console.log(`Title: ${getIssueInfoResult.node.title}`)
    } 

    const requestedIssueID = core.getInput('requestedIssueID')

    // Add Comment to Requested Issue

    const requestIssueComment = dedent`
    New Early Access Request: ${getIssueInfoResult.node.title} #${getIssueInfoResult.node.number}`

    const requestedIssueCommentVariables = {
      issueId: requestedIssueID,
      commentBody: requestIssueComment,
    }
    const requestedIssueCommentResult = await octokit.graphql(addCommentMutation, requestedIssueCommentVariables)
    if (!requestedIssueCommentResult) {
      core.setFailed('GraphQL request failed')
    } 
    else {
      console.log(`Added Comment to Issue nodeId: ${requestedIssueCommentResult.addComment.commentEdge.node.id}`)
    } 

  } catch (error) {
    core.setFailed(error.message);
  }
}