const { Schema } = require('mongoose')
const mongoose = require('mongoose')

const ticketSchema = new Schema({
    type: String,
    userId: String,
    channelId: String,
    closed: Boolean,
    claimed: Boolean,
    claimId: String,
    username: String
})

module.exports = mongoose.model('ticket', ticketSchema);
