const core = require('@actions/core');
const github = require('@actions/github');

try {
  const myToken = core.getInput('myToken');
  const octokit = github.getOctokit(myToken)

  const scRequestedLabledID = core.getInput('requestedLabelID');
  const issueID = "a"

  console.log(github.context.payload)



} catch (error) {
  core.setFailed(error.message);
}