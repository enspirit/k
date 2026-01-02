(function(_) { return (function() { if (!(DateTime.now() > DateTime.fromISO('2020-01-01T00:00:00Z'))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now().startOf('day') >= DateTime.fromISO('2020-01-01'))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now().startOf('day').plus(Duration.fromISO('P1D')) > DateTime.now().startOf('day'))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now().startOf('day').minus(Duration.fromISO('P1D')) < DateTime.now().startOf('day'))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now().startOf('day').plus(Duration.fromISO('P1D')) > DateTime.now().startOf('day').minus(Duration.fromISO('P1D')))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now() > DateTime.fromISO('2024-01-01T00:00:00Z'))) throw new Error("Assertion failed"); return true; })(); })(null);
(function(_) { return (function() { if (!(DateTime.now().startOf('day') > DateTime.fromISO('2024-01-01'))) throw new Error("Assertion failed"); return true; })(); })(null);
