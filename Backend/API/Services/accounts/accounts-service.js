const { AccountModel } = require("../../../Database/Schemas/accountSchema.js");

const getUsers = () => AccountModel.find();
const getUserByEmail = (email) => AccountModel.findOne({ email: email });
const getUserById = (id) => AccountModel.findById(id);
const getUserByUsername = (username) => AccountModel.findOne({ username: username });
const createUser = (values) =>
  AccountModel.create(values).then((user) => user.toObject());
const updateUser = (id, values) =>
  AccountModel.findByIdAndUpdate(id, values, { new: true });
const deleteUser = (id) => AccountModel.findByIdAndDelete({id: id});

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
};
