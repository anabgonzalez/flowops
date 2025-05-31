import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    customerName:{
        type: String,
        required: true,
    },
    description:{
        type: String,
    },
    status:{
        type: String,
        enum:[
            "new",
            "quoted",
            "scheduled",
            "in_progress",
            "completed",
            "cancelled",
        ],
        default: "new",
    }
}, {
    timestamps: true // createdAt, updatedAt
});

// Tells mongoose to create 'Job' collection and to look at the jobSchema
const Job = mongoose.model("Job", jobSchema);

export default Job;