const { AuthenticationError } = require('apollo-server-errors');
const { User } = require('../models');
const { signToken } = require('../utils/auth');


const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log(`hey, we got here! ${context.user._id}`);
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id})
          .select('-__v -password')
          .populate('savedBooks');
        return userData;
      }
      console.log(userData)
      throw new AuthenticationError('Not logged in')
    }
  },

  Mutation: {
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

    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user)

      return { user, token };
    },

    saveBook: async (parent, { body }, context) => {
      console.log(`saveBook mutation args: ${body}`);
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: body } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }

      throw new AuthenticationError('You must be logged in')
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { bookDetails: bookId }},
          { new: true }
        );
        
        return updatedUser;
      }

      throw new AuthenticationError('You must be logged in')    
    }
  }
}; 

module.exports = resolvers;