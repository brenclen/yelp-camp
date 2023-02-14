const express = require('express');
const path = require('path')
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync')
const { campgroundSchema, reviewSchema } = require('./schemas')

//*2*
const methodOverride = require('method-override')
const Campground = require('./models/campground');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const Review = require('./models/review');


mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlparser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})
const app = express();

app.engine('ejs', ejsMate)

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

//*1*
app.use(express.urlencoded({ extended: true }))
//*3*
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(', ')
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}


app.get('/', (req, res) => {
    res.render('home');
})

app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
})

app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new');
})

//wILL NOT PARSE BODY AUTOMATICALLY, SET UP URL PARSER, SEE *1*
app.post('/campgrounds', validateCampground, catchAsync(async (req, res) => {
    //because this function argument is wrapped in our catchAsync function we can just throw the error and the function will catch it
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 404)
    //this is NECESARRY for ASYNC errors, without this we don't hit app.use(err) at the bottom
    //FORM ACTION IS PACKAGING BODY FUNNY, LOG IT TO ANALYZE
    const newCampground = await new Campground(req.body.campground)
    await newCampground.save()
    res.redirect(`campgrounds/${newCampground._id}`)
}))

//when clicking campground, url contains id, grabs the id, finds it in db **ORDER MATTERS OF REQUESTS**
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id).populate('reviews')
    res.render('campgrounds/show', { campground });
}))

app.get('/campgrounds/:id/edit', validateCampground, catchAsync(async (req, res) => {
    const id = req.params.id;
    const campground = await Campground.findById(id)
    res.render('campgrounds/edit', { campground });
}))

//this is where the form in edit.ejs submits to
//dont forget *2* and *3* method override above
app.put('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    //req.body.campground is an object, spreading it
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
    res.redirect(`/campgrounds/${campground._id}`)
}))



app.get('/makecampground', catchAsync(async (req, res) => {
    const camp = new Campground({ title: 'My backyard', description: 'Cheap camping' })
    await camp.save();
    res.send(camp)
}))

//like edit, there is a form in show.ejs that has a form that submit to '/campgrounds/:id', deletes it
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    res.redirect('/campgrounds')
}))

app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res, then) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    const review = new Review(req.body.review)
    await campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    // remove the reference in the reviews array
    const campground = await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    //remove the actual review from the db
    const review = await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`)
}))

//* = every path, catches errors caused by no route
app.all('*', (req, res, next) => {
    //since you're next'ing the error, you don't throw it
    next(new ExpressError('page not found', 404))
})

//doesn't handle async errors by default, need the catchAsync
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'something went wrong' } = err;
    if (!err.message) {
        err.message = 'oh no something went wrong...'
    }
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('listening on 3000...')
})
