class Utils {
  getCleanName(name) {
    return name.split(' ').filter(w => w.length > 0).join('-').toLowerCase();
  }
}

module.exports = {utils: new Utils()}