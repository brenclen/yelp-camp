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

//after findOneAndDelete (includes multiple delete methods, see docs) deletedDoc is object containing what was just deleted, then remove (delete all reviews associated with it)
CampgroundSchema.post('findOneAndDelete', async (deletedDoc) => {
    if (deletedDoc) {
        await Review.deleteMany({
            _id: { $in: deletedDoc.reviews }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema)