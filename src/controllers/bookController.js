const bookModel = require("../models/bookModel");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");
const moment = require("moment");
const { isValidObjectId } = require("mongoose");
const {isValid,isValidString,isValidRequestBody,isValidISBN }=require("../utils/validation")
const { isAuthenticated, isAuthorized } = require("../middlewares/authMiddleware");


// ===================================== Create Books =====================================================//



const createBook = async function (req, res) {
    try {
        let body = req.body;
        let {
            title,
            excerpt,
            ISBN,
            category,
            subcategory,
            releasedAt
        } = body;

        if (!isValid(title) || !isValid(excerpt) || !isValid(ISBN) || !isValid(subcategory) || !isValid(category) || !isValid(releasedAt)) {
            return res.status(400).send({
                status: false,
                message: "Please Provide All valid Field"
            });
        }

        if (!isValidRequestBody(title) || !isValidRequestBody(excerpt) || !isValidRequestBody(ISBN) || !isValidRequestBody(subcategory) || !isValidRequestBody(category) || !isValidRequestBody(releasedAt)) {
            return res.status(400).send({
                status: false,
                message: "Please Provide All valid Field"
            });
        }

        if (!isValidISBN(ISBN)) {
            return res.status(400).send({
                status: false,
                message: " Invalid ISBN number it should contain only 13 digits"
            });
        }

        const unique = await bookModel.findOne({
            $or: [{
                title: title
            }, {
                ISBN: ISBN
            }, {
                title: title
            }]
        })


        if (unique) {
            return res.status(400).send({
                status: false,
                message: "Book already exits"
            });
        }

        let trimReleasedAt = releasedAt.trim()

        if (moment(trimReleasedAt, "YYYY-MM-DD").format("YYYY-MM-DD") !== trimReleasedAt) {
            return res.status(400).send({
                status: false,
                message: "Please enter the Date in the format of 'YYYY-MM-DD'."
            });

        }

        const bookList = await bookModel.create(body);

        res.status(201).send({
            status: true,
            message: "Success",
            data: bookList
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

// ====================================== Get All Books List ==================================================//



const getBooks = async function (req, res) {
    try {
        let data = req.query;
        const { userId, category, subcategory } = data;

        if (userId) {

            if (!isValidObjectId(userId)) {
                return res.status(404).send({ status: false, message: "Invalid User ID." });
            }

            const checkUserId = await userModel.findById(userId);

            if (!checkUserId) {
                return res.status(404).send({ status: false, message: "Data not found with this User ID. Please enter a valid User ID." });
            }
        }

        const bookDetails = await bookModel.find({ ...data, isDeleted: false }).sort({ title: 1 }).select({ isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0, ISBN: 0, subcategory: 0 });

        if (bookDetails.length == 0) {
            return res.status(404).send({ status: false, message: "Data not found or data already deleted." });
        }

        res.status(200).send({ status: true, message: "Books List.", data: bookDetails });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}



// ================================= Get Books List By BookId =================================================//



const getBookById = async function (req, res) {
    try {
      const bookId = req.params.bookId;
  
      if (!isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: "Please provide a valid book ID." });
      }
  
      const getBookData = await bookModel
        .findOne({ _id: bookId, isDeleted: false })
        .select({ __v: 0 });
  
      if (!getBookData) {
        return res.status(404).send({ status: false, message: "No book exists with this ID or it might be deleted." });
      }
  
      const reviewData = await reviewModel
        .find({ bookId, isDeleted: false })
        .select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 });
  
      const reviewCount = reviewData.length;
  
      const bookDetails = {
        ...getBookData._doc,
        reviewsData: reviewData,
        reviews: reviewCount
      };
  
      return res.status(200).send({ status: true, message: 'Book Details', data: bookDetails });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };
  



// =================================== Update Books ===========================================================//



const updateBooks = async function (req, res) {
    try {
        let BookID = req.params.bookId;

        let data = req.body;
        const { title, excerpt, ISBN, releasedAt } = data;

        if (Object.keys(data).length != 0) {

            if (!title && !excerpt && !ISBN && !releasedAt) {
                return res.status(400).send({ status: false, message: "At least one field is required." });
            }

            let updateData = {};

            if(title){
            if (!isValid(title)) {
                    return res.status(400).send({ status: false, message: "Title is not Valid." });
                }

                const checkTitle = await bookModel.findOne({ title: title });

                if (checkTitle) {
                    return res.status(400).send({ status: false, message: `The title ${title} is already is in use for a Book.Try another one.` });
                }

                updateData.title = title;
            }    

            if(excerpt){
            if (!isValid(excerpt)) {
                    return res.status(400).send({ status: false, message: "Excerpt is not Valid" });
                }
                updateData.excerpt = excerpt;
            }

            if(ISBN){    
            if (!isValid(ISBN)) {
                    return res.status(400).send({ status: false, message: "ISBN is not valid" });
                }

                if (!validateISBN(ISBN)) {
                    return res.status(400).send({ status: false, message: " Invalid ISBN number it should contain only 13 digits" });
                }

                const checkISBN = await bookModel.findOne({ ISBN: ISBN });

                if (checkISBN) {
                    return res.status(400).send({ status: false, message: `The ISBN ${ISBN} is already is in use for a Book.Try another one.` });
                }

                updateData.ISBN = ISBN;
            }    

            if (releasedAt) {

                if (!isValid(releasedAt)) {
                    return res.status(400).send({ status: false, message: "releasedAt must be in string" });
                }

                if (moment(releasedAt, "YYYY-MM-DD").format("YYYY-MM-DD") !== releasedAt) {
                    return res.status(400).send({ status: false, message: "Please enter the Date in the format of 'YYYY-MM-DD'." });
                }

                updateData.releasedAt = releasedAt;
            }

            const updateBookDetails = await bookModel.findOneAndUpdate(
                { _id: BookID, isDeleted: false },
                updateData,
                { new: true }
            );

            if (!updateBookDetails) {
                return res.status(404).send({ status: false, message: "No data found for updation." });
            }

            res.status(200).send({ status: true, message: "Success", data: updateBookDetails });
        } else {
            return res.status(400).send({ status: false, message: "Invalid request, body can't be empty." });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}



// ====================================== Delete Books ===================================================//



const deleteBookById = async function (req, res) {
    try {
        let bookId = req.params.bookId;

        let deleteByBookId = await bookModel.findOneAndUpdate(
            { _id: bookId, isDeleted: false },
            { isDeleted: true, deletedAt: Date.now() }
        );

        if (!deleteByBookId) {
            return res.status(404).send({ status: false, message: "Book is already deleted." });
        }

        await reviewModel.updateMany(
            { bookId: bookId, isDeleted: false },
            { isDeleted: true }
        );

        return res.status(200).send({ status: true, message: "Successfully Deleted." });
    } catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}



module.exports = { createBook, getBooks, getBookById, updateBooks, deleteBookById };