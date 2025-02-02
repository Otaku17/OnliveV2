import createEventHandler from '@logic/createEventHandler';

const pingHandler = createEventHandler('ping', (data, ws) => {
  ws.on('ping', (binaryPayload) => {
    console.log(`Received ping from player`);
    ws.pong(binaryPayload);
  });
  return {
    message: data,
  };
});

export default pingHandler;
