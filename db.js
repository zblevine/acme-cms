const Sequelize = require('sequelize');
const { STRING, INTEGER } = Sequelize;
const conn = new Sequelize('postgres://localhost/acme_cms_db');

const Page = conn.define('page', {
  id: {
    type: INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: STRING,
    allowNull: false
  }
})

Page.findHomePage = function () {
  return this.findOne({
    where: {
      parentId: null
    }
  })
}

Page.prototype.findChildren = function () {
  return Page.findAll({
    where: {
      parentId: this.id
    }
  })
}

Page.prototype.hierarchy = async function() {
  const hierarchy = [this];
  let parentId = this.parentId;
  while (parentId) {
    const parentPage = await Page.findByPk(parentId);
    hierarchy.push(parentPage);
    parentId = parentPage.parentId;
  }
  return hierarchy;
}

Page.belongsTo(Page, {as: 'parent', foreignKey: 'parentId'});

const mapAndSave = (pages) => Promise.all(pages.map(page => Page.create(page)));

const syncAndSeed = async () => {
  await conn.sync({force: true})
  const home = await Page.create({ title: 'Home Page' })
  let pages = [
    {title: 'About', parentId: home.id},
    {title: 'Contact', parentId: home.id}
  ]
  const [about, contact] = await mapAndSave(pages);
  pages = [
    {title: 'About Our Team', parentId: about.id},
    {title: 'About Our History', parentId: about.id},
    {title: 'Phone', parentId: contact.id},
    {title: 'Fax', parentId: contact.id}
  ]
  const [ team, history, phone, fax] = await mapAndSave(pages);
}

module.exports = {
  syncAndSeed,
  models: {
    Page
  }
}

syncAndSeed()
  .then(async() => {
    const home = await Page.findHomePage();
    console.log(home.title) //Home Page
    const homeChildren = await home.findChildren();
    console.log(homeChildren.map(page => page.title)); //[About, Contact]
    const fax = await Page.findOne({where: {title: 'Fax'}});
    console.log(fax.title);
    let hier = await fax.hierarchy();
    console.log(hier.map( page => page.title));
    const history = await Page.findOne({ where: {title: 'About Our History'}});
    hier = await history.hierarchy();
    console.log(hier.map(page => page.title));
  })