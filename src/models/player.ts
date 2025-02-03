import { Schema, Document, model } from 'mongoose';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

interface IPlayer extends Document {
  id: string;
  name: string;
  isGirl?: boolean;
  charsetBase?: string;
  greeting?: string;
  friendCode: string;
  friends: string[];
  lastConnection: Date;
  isConnect: boolean;
}

const SPlayer: Schema<IPlayer> = new Schema<IPlayer>({
  id: { type: String, default: generateId, unique: true },
  name: { type: String, required: true },
  isGirl: { type: Boolean, default: true },
  charsetBase: { type: String },
  greeting: { type: String },
  friendCode: { type: String, default: generateId, unique: true },
  friends: { type: [String], default: [] },
  lastConnection: { type: Date, default: Date.now },
  isConnect: { type: Boolean, default: false },
});

const Player = model<IPlayer>('Player', SPlayer);

export { Player, IPlayer };
