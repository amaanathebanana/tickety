async function checkMessages(channel) {
    const messages = await channel.messages.fetch({ limit: 5 })
    messages.forEach(message => console.log(message.content))
}

module.exports = { checkMessages }