//THIS FILE IS NOT REQUIRED ANYWHERE, SIMPLY SEEDS THE DATABASE

const mongoose = require('mongoose');
const Campground = require('../models/campground')
const { places, descriptors } = require('./seedHelpers')
const cities = require('./cities')


//CONNECTING TO OUR DB
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlparser: true,
    useUnifiedTopology: true
})

//RENAME DB FOR USE
const db = mongoose.connection;

//ERROR HANDLING
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})

//FOR RANDOM TITLES, TAKE ARRAY AND RETURNS RANDOM ITEM IN THE ARRAY
const sample = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

const seedDB = async () => {
    //REMOVES ALL ITEMS IN THE DB COLLEXTION
    await Campground.deleteMany()
    for (let i = 0; i < 50; i++) {
        let random = getRandomInt(18)
        const price = getRandomInt(50) * 10
        const camp = new Campground({
            location: `${cities[random].city}, ${cities[random].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://picsum.photos/200/300',
            description: 'Launch VS Code. · Open the Command Palette (Cmd+Shift+P) and type bababababa to find the Shell Command: Install command in PATH command.',
            price: price
        })
        await camp.save()
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

seedDB().then(() => {
    db.close();
})
