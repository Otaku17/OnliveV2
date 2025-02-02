import createEventHandler from '@logic/createEventHandler';

const greetHandler = createEventHandler('greet', (data) => {
  const { name } = data;
  return {
    message: `Hello, ${name}!`,
  };
});

export default greetHandler;
