module.exports = {
    RandomRangeInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min); //The maximum and minimum are inclusive
    },    
    RandomRangeFloat: function(min, max) {
        return min + (max - min) * ((1 + 10E-16) * Math.random()); //The maximum is inclusive and the minimum is inclusive
    },
    ArrayRemove(array, value) {
        return array.filter(function(element) {
            return element != value;
        });
    }
};