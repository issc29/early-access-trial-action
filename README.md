# Early Access Trial Action

Allows people to request an Early Access during trials.

### Features
- Expects a slash command to be run with Early Access questions
- Posts the responses back in the issue
- Adds the issue to the early-access requested Issue
- Adds a label to the trial issue for easy navigation

### Inputs: 
- `github-token`: token to be used
- `requestedLabelID`: label node id to be added to issue when early access is requested
- `requestedIssueID`: issue node id for issue to add comment on when early access is requested
- `shipped`: 'false' - early access is open, 'true' - early access has ended

