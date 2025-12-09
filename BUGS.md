# Aeroduel Server Bugs
The bug tracker for the Aeroduel Server.

[//]: # (Because I was too lazy to make GitHub issues for all these bugs)

## Known Bugs

### Server either does not build or does not load CSS on MacOS

#### Possible Causes
- Unknown

#### Possible Fixes and Workarounds
- None yet.

#### Troubleshooting Options
- Turn your device off and back on again.
- Try in docker if MacOS is available in docker.

---

### `timeRemaining` Attribute of Match State in WebSocket `match:update` is Always Null
![Image from mobile simulator](/markdown%20assets/timeRemainingNull.png)

### Possible Causes
- Unknown

### Possible Fixes and Workarounds
- Remove timeRemaining from match:update as it's probably not needed.
- Find out why it's null and give it a value.


## Future Bugs
<small>AI autocomplete generated this, and I figured I'd have some fun with it.</small>

- Server crashes when a player leaves a match
- Server crashes when a player joins a match
- Server crashes when a plane hits the ground
- Tux the penguin takes players' heads off
- Server crashes when a player is kicked from a match
