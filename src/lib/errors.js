function handleErrors(err) {
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}

export function errors(fn) {
  return function (...args) {
    fn(...args).catch(handleErrors);
  };
}
