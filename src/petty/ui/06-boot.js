// Start on the title card.
setScene();
render();
// ?play jumps straight into a game
if (/play/.test(location.search)) skipToGame();
