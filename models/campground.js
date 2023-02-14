const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String,
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }]
})

//if there was a document to delete, after we delete the campground from DB (post), we must delete it's children in order to not have orphaned reviews, etc
//this is called by the findByIdAndDelete function in app.js
CampgroundSchema.post('findOneAndDelete', async (deletedDoc) => {
    if (deletedDoc) {
        await Review.deleteMany({
            _id: { $in: deletedDoc.reviews }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema)