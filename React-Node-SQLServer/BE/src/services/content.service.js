"use strict";

const { db } = require("../../config/db/mssql.config");
const { NotFoundRequestError, ConflictRequestError } = require("../utils/error.response");
const { Op } = require("sequelize");
const { mapperSlug } = require("../utils/mapper.util");

class ContentService {
  static create = async (data) => {
    const categoryExist = await db.Contents.findOne({
      where: {
        categoryName: {
          [Op.like]: data.categoryName,
        },
      },
    });

    if (categoryExist) {
      throw new ConflictRequestError("Tên danh mục đã tồn tại");
    }

    const slug = mapperSlug(data.categoryName);

    const response = await db.Contents.create({ ...data, slug });

    return response;
  };

  static get = async () => {
    const response = await db.Contents.findAll();

    return response;
  };

  static getById = async (id) => {
    const response = await db.Contents.findByPk(id);

    if (!response) throw new NotFoundRequestError("Không tìm thấy nội dung với id " + id);

    return response;
  };

  static getBySlug = async (slug) => {
    const response = await db.Contents.findOne({ where: { slug } });

    if (!response) throw new NotFoundRequestError("Không tìm thấy nội dung với slug " + slug);

    return response;
  };

  static delete = async (id) => {
    const contentExist = await db.Contents.findByPk(id, { raw: false });

    if (!contentExist) {
      throw new NotFoundRequestError("Không tìm thấy nội dung với id " + id);
    }

    contentExist.destroy();

    return true;
  };

  static update = async (id, data) => {
    const [contentExist, categoryExist] = await Promise.all([
      db.Contents.findByPk(id, { raw: false }),
      db.Contents.findOne({
        where: {
          categoryName: {
            [Op.like]: data.categoryName,
          },
        },
      }),
    ]);

    if (!contentExist) {
      throw new NotFoundRequestError("Không tìm thấy nội dung với id " + id);
    }

    if (categoryExist && categoryExist.get().id !== +id) {
      throw new ConflictRequestError("Tên danh mục đã tồn tại");
    }

    contentExist.categoryName = data.categoryName;
    contentExist.content = data.content;
    contentExist.slug = mapperSlug(data.categoryName);

    await contentExist.save();

    return contentExist;
  };
}

module.exports = ContentService;
