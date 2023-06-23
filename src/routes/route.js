const router = require("express").Router();


const { createUser, loginUser } = require("../controllers/userController");
const { createBook, getBooks, getBookById, updateBooks, deleteBookById } = require("../controllers/bookController");
const { reviewBook, updateBookReview, deleteReviewById } = require("../controllers/reviewController");
const { isAuthenticated, isAuthorized } = require("../middlewares/authMiddleware");


//======================================= Post APIs =============================================//


router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/books", isAuthenticated, isAuthorized, createBook);
router.post("/books/:bookId/review", reviewBook);


// ===================================== Get APIs ===============================================//


router.get("/books", isAuthenticated, getBooks);
router.get("/books/:bookId", isAuthenticated, getBookById);


//===================================== Put APIs ==============================================//


router.put("/books/:bookId", isAuthenticated, isAuthorized, updateBooks);
router.put("/books/:bookId/review/:reviewId", updateBookReview);


//===================================== Delete APIs ==========================================//
router.delete("/books/:bookId", isAuthenticated, isAuthorized, deleteBookById);
router.delete("/books/:bookId/review/:reviewId", deleteReviewById);


//================================= Invalid Path API =========================================//


router.all('/*', (req , res) => {
    res.status(400).send({ status: false, message: " path invalid" });
});


module.exports = router;