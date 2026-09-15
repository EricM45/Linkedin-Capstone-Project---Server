import mongoose from 'mongoose'

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { _id: true }
)

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, required: true },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
  },
  { _id: true }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    headline: { type: String, default: '', maxlength: 220 },
    about: { type: String, default: '', maxlength: 2600 },
    location: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    bannerPhoto: { type: String, default: '' },

    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)
export default User
