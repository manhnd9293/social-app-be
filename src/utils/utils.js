class Utils {
  getCleanName(name) {
    return name.split(' ').filter(w => w.length > 0).join('-').toLowerCase();
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  upperCaseFirst(string) {
    return string
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.substring(1,word.length))
      .join(' ');
  }

}

module.exports = {utils: new Utils()}