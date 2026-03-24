const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String,
    required: true
  },
  business: {
    type: String,
    required: true
  },
  isContractor: {
    type: Boolean,
    default: false
  },
  note: {
    type: String
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    description: {
      type: String
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', SupplierSchema);
