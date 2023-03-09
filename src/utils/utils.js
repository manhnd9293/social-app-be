class Utils {
  getCleanName(name) {
    return name.split(' ').filter(w => w.length > 0).join('-').toLowerCase();
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }


}

module.exports = {utils: new Utils()}