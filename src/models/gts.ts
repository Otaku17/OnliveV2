import { model, Schema } from 'mongoose';

interface IGts extends Document {
  id: string;
  player_id: string;
  creature: {
    id: string;
    level: number;
    shiny: boolean;
    form: number;
    nature: number;
    data: Record<string, unknown>;
  };
  condition: {
    specie: string;
    level: {
      min: number;
      max: number;
    };
    shiny?: boolean;
    form?: number;
    nature?: number;
  };
  createdAt: Date;
}

const SGts = new Schema<IGts>({
  id: {
    type: String,
    default: function () {
      return `gts-${Math.random().toString(36).substring(2, 10)}`;
    },
    unique: true,
  },
  player_id: { type: String, required: true },
  creature: {
    id: { type: String, required: true },
    level: { type: Number, required: true },
    shiny: { type: Boolean, required: true },
    form: { type: Number, required: true },
    nature: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  condition: {
    specie: { type: String, required: true },
    level: {
      min: { type: Number, required: true, min: 1 },
      max: { type: Number, max: process.env.MAX_LEVEL },
      validate: {
        validator: function (v: { min: number; max: number }) {
          return v.max > v.min;
        },
        message: 'Max level must be greater than Min level',
      },
    },
    shiny: { type: Boolean },
    form: { type: Number },
    nature: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

const Gts = model<IGts>('Gts', SGts);

export { Gts, IGts };
