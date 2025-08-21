import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkOwnership = (tweet, userId) => {
  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to modify this tweet");
  }
};

const createTweet = asyncHandler(async (req, res) => {
  //get user id  & validate
  //get tweet content from request body
  //validate tweet content
  //find user by id
  //validate user
  //create new tweet
  //return tweet

  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.create({ content, owner: userId });

  return res
    .status(201)
    .json(ApiResponse(201, tweet, "Tweet added successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  //get user id & validate
  //find user by id & validate
  // get pagination values
  //find tweets of user
  //return tweets

  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const pageNum = Number(req.query.page) || 1;
  const limitNum = Number(req.query.limit) || 10;

  const tweets = await Tweet.find({ owner: userId })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .lean();

  const totalTweets = await Tweet.countDocuments({ owner: userId });

  return res.status(200).json(
    ApiResponse(
      200,
      {
        tweets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalTweets,
          totalPages: Math.ceil(totalTweets / limitNum),
        },
      },
      "Tweets fetched successfully"
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  //get tweet id
  //get new content from body
  //validate tweetId & content
  //find tweet
  //check if tweet exists
  //check if tweet belongs to user
  //update tweet
  //return updated tweet

  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  checkOwnership(tweet, req.user._id);

  tweet.content = content;
  const updatedTweet = await tweet.save();

  return res
    .status(200)
    .json(ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //get tweet id
  //find tweet
  //check if tweet exists
  //check if tweet belongs to user
  //delete tweet
  //return deleted tweet

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  checkOwnership(tweet, req.user._id);

  await tweet.deleteOne();

  return res
    .status(200)
    .json(ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
