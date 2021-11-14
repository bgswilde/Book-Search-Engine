const { AuthenticationError } = require('apollo-server-errors');
const { User } = require('../models');
const { signToken } = require('../utils/auth');


const resolvers = {
  Query: {
    // for when user data is required, i.e. the savedBooks page
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id})
          .select('-__v -password')
        return userData;
      }
      console.log(userData)
      throw new AuthenticationError('Not logged in')
    }
  },

  Mutation: {
    // takes the token and verifies credentials on login
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }
    
      const correctPw = await user.isCorrectPassword(password);
    
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
      
      const token = signToken(user);
      return { token, user };
    },

    // creates a user and signs token
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user)

      return { user, token };
    },

    // saves a selected book to the user's savedBooks array
    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
        
        return updatedUser;
      }

      throw new AuthenticationError('You must be logged in')
    },

    // removes a selected book from the user's savedBooks array
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        
        return updatedUser;
      }

      throw new AuthenticationError('You must be logged in')    
    }
  }
}; 

module.exports = resolvers;