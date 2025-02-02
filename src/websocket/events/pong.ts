import createEventHandler from '@logic/createEventHandler';

const pongHandler = createEventHandler('pong', (data, ws) => {
  ws.on('pong', (binaryPayload) => {
    console.log(`Received ping from player`);
    ws.ping(binaryPayload);
  });
  return {
    message: data,
  };
});

export default pongHandler;
