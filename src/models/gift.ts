import { Document, model, Schema } from 'mongoose';

function generateId() {
  const random = Math.random().toString(36).substring(2, 10);
  return `gift-${random}`;
}

interface IItem {
  id: string;
  count: number;
}

interface ICreature {}

interface IEgg {}

interface IGift extends Document {
  id: string;
  title: string;
  items?: IItem[];
  creatures?: ICreature[];
  eggs?: IEgg[];
  claimedBy: string[];
  type: 'code' | 'internet';
  code: string;
  
}

const SGift = new Schema<IGift>(
  {
    id: { type: String, default: generateId, unique: true },
    title: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        count: { type: Number, default: 1 },
      },
    ],
    creatures: [{ type: Object }],
    eggs: [{ type: Object }],
    claimedBy: { type: [String], default: [] },
    type: { type: String, required: true, enum: ['code', 'internet'] },
    code: {
      type: String,
      required: function () { return this.type === 'code'; }
    },

  }
);

const Gift = model<IGift>('Gift', SGift);

export { Gift, IGift };
