# Fetch request recorder and replay

This is a proof of concept for recording fetch api requests and then replaying the saved version by intercepting and matching the requests.

## How to use

- Click the `record` button.
- Refresh the page
- Click on buttons
- Click save. This will save the recording snapshot into the local storage

To use the saved snapshot, simply click the `fake` button. Now all the requests that were previously intercepted will be fetched from memory.

