const { UserInputError, AuthenticationError } = require('apollo-server')
const bcrypt = require('bcryptjs')

const User = require('../models/user')
const Skill = require('../models/skill')
const Question = require('../models/question')
const Assessment = require('../models/assessment')
const Test = require('../models/test')
const { createToken } = require('../utils')

const Mutation = {
  createUser: (root, { name, email, password, role }) => {
    if (role === 'Admin') {
      throw new UserInputError(
        'You do not have permission to create this user!'
      )
    }

    const user = new User({ name, email, password, role })

    return user.save().catch((error) => {
      throw new UserInputError(error.message)
    })
  },

  login: async (root, { email, password }) => {
    const user = await User.findOne({ email }).select('+password').exec()

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UserInputError('wrong credentials')
    }

    const { _id, name, role } = user

    const userForToken = {
      email,
      id: _id,
    }

    return {
      token: createToken(userForToken),
      name,
      email,
      role,
      id: _id,
    }
  },

  createSkill: (
    root,
    { name, description, noOfQuestions, questions },
    { currentUser }
  ) => {
    if (!currentUser) {
      throw new AuthenticationError('Not authenticated')
    }

    if (currentUser.role !== 'Admin') {
      throw new UserInputError('You do not have required permission!')
    }

    const skill = new Skill({ name, description, noOfQuestions, questions })

    skill.save()

    return skill.populate('questions')
  },

  createQuestion: (
    root,
    { title, type, options, correctOption, skillId },
    { currentUser }
  ) => {
    if (!currentUser) {
      throw new AuthenticationError('Not authenticated')
    }

    if (currentUser.role !== 'Admin') {
      throw new UserInputError('You do not have required permission!')
    }

    const question = new Question({
      title,
      type,
      options,
      correctOption,
      skill: skillId,
    })

    return question.save()
  },

  createTest: (root, { name, skills }, { currentUser }) => {
    if (!currentUser) {
      throw new AuthenticationError('Not authenticated')
    }

    if (currentUser.role !== 'Admin') {
      throw new UserInputError('You do not have required permission!')
    }

    const test = new Test({ name, skills })

    test.save()

    return test.populate('skills')
  },

  createAssessment: (root, { status, testId, userId }) => {
    // TODO: write logic for calculating score
    const assessment = new Assessment({
      status,
      test: testId,
      user: userId,
      score: 3,
    })

    return assessment.save()
  },
}

module.exports = Mutation
