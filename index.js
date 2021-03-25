const core = require('@actions/core');
const github = require('@actions/github');

try {
  const myToken = core.getInput('myToken');
  const octokit = github.getOctokit(myToken)

  const scRequestedLabledID = core.getInput('requestedLabelID');
  const payload = github.context.payload

  const issueID = JSON.parse(payload.client_payload.command.resource.id)

  const comment = `
    Early Access Name: ${payload.client_payload.data['Early Access Name']}
    * Is this an existing customer or prospect? ${payload.client_payload.data['Briefed of Functionality?']}
    * [Prospect] Have they been briefed on the functionality of Security Center today? ${payload.client_payload.data['Existing GHAS Customer?']}
    * [Prospect] Is Security Center critical to the success of the POC? ${payload.client_payload.data['Critical to POC?']}
    * [Prospect] Comments: ${payload.client_payload.data['Comments']}
      Next steps: Needs approval by @niroshan or @issc29`
    
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
  
  const commentVariables = {
    issueId: issueID,
    commentBody: comment,
    headers: {
      Accept: `application/vnd.github.starfox-preview+json`
    }
  }
  const commentResult = await octokit.graphql(addCommentMutation, commentVariables)
  if (!commentResult) {
    core.setFailed('GraphQL request failed')
  } 
  else {
    console.log(`Added Comment to Issue: issueID, nodeId: ${commentResult.addComment.commentEdge.node.id}`)
  } 
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

} catch (error) {
  core.setFailed(error.message);
}