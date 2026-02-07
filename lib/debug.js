// Debug logging - only outputs when DEBUG env var is set
const debug = (message) => {
  if (process.env.DEBUG) {
    console.log(message);
  }
};

export default debug;
