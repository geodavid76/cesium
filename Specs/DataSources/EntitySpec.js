/*global defineSuite*/
defineSuite([
        'DataSources/Entity',
        'Core/Cartesian3',
        'Core/JulianDate',
        'Core/Matrix3',
        'Core/Matrix4',
        'Core/Quaternion',
        'Core/TimeInterval',
        'Core/TimeIntervalCollection',
        'Core/Transforms',
        'DataSources/ConstantProperty'
    ], function(
        Entity,
        Cartesian3,
        JulianDate,
        Matrix3,
        Matrix4,
        Quaternion,
        TimeInterval,
        TimeIntervalCollection,
        Transforms,
        ConstantProperty) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    it('constructor sets id.', function() {
        var entity = new Entity({
            id : 'someId'
        });
        expect(entity.id).toEqual('someId');
    });

    it('isAvailable is always true if no availability defined.', function() {
        var entity = new Entity();
        expect(entity.isAvailable(JulianDate.now())).toEqual(true);
    });

    it('isAvailable throw if no time specified.', function() {
        var entity = new Entity();
        expect(function() {
            entity.isAvailable();
        }).toThrowDeveloperError();
    });

    it('constructor creates a unique id if one is not provided.', function() {
        var object = new Entity();
        var object2 = new Entity();
        expect(object.id).toBeDefined();
        expect(object.id).toNotEqual(object2.id);
    });

    it('isAvailable works.', function() {
        var entity = new Entity();
        var interval = TimeInterval.fromIso8601({
            iso8601 : '2000-01-01/2001-01-01'
        });
        var intervals = new TimeIntervalCollection();
        intervals.addInterval(interval);
        entity.availability = intervals;
        expect(entity.isAvailable(JulianDate.addSeconds(interval.start, -1, new JulianDate()))).toEqual(false);
        expect(entity.isAvailable(interval.start)).toEqual(true);
        expect(entity.isAvailable(interval.stop)).toEqual(true);
        expect(entity.isAvailable(JulianDate.addSeconds(interval.stop, 1, new JulianDate()))).toEqual(false);
    });

    it('definitionChanged works for all properties', function() {
        var entity = new Entity();
        var propertyNames = entity.propertyNames;
        var propertyNamesLength = propertyNames.length;

        var listener = jasmine.createSpy('listener');
        entity.definitionChanged.addEventListener(listener);

        var i;
        var name;
        var newValue;
        var oldValue;
        //We loop through twice to ensure that oldValue is properly passed in.
        for (var x = 0; x < 2; x++) {
            for (i = 0; i < propertyNamesLength; i++) {
                name = propertyNames[i];
                newValue = new ConstantProperty(1);
                oldValue = entity[propertyNames[i]];
                entity[name] = newValue;
                expect(listener).toHaveBeenCalledWith(entity, name, newValue, oldValue);
            }
        }
    });

    it('merge always overwrites availability', function() {
        var entity = new Entity();
        var interval = TimeInterval.fromIso8601({
            iso8601 : '2000-01-01/2001-01-01'
        });
        entity.availability = interval;

        var entity2 = new Entity();
        var interval2 = TimeInterval.fromIso8601({
            iso8601 : '2000-01-01/2001-01-01'
        });
        entity2.availability = interval2;

        entity.merge(entity2);
        expect(entity.availability).toBe(interval2);
    });

    it('merge works with custom properties.', function() {
        var propertyName = 'customProperty';
        var value = 'fizzbuzz';

        var source = new Entity({
            id : 'source'
        });
        source.addProperty(propertyName);
        source[propertyName] = value;

        var listener = jasmine.createSpy('listener');

        var target = new Entity({
            id : 'target'
        });

        //Merging should actually call addProperty for the customProperty.
        spyOn(target, 'addProperty').andCallThrough();
        target.merge(source);

        expect(target.addProperty).toHaveBeenCalledWith(propertyName);
        expect(target[propertyName]).toEqual(source[propertyName]);
    });

    it('merge throws with undefined source', function() {
        var entity = new Entity();
        expect(function() {
            entity.merge(undefined);
        }).toThrowDeveloperError();
    });

    it('_getModelMatrix returns undefined when position is undefined.', function() {
        var entity = new Entity();
        entity.orientation = new ConstantProperty(Quaternion.IDENTITY);
        expect(entity._getModelMatrix(new JulianDate())).toBeUndefined();
    });

    it('_getModelMatrix returns correct value.', function() {
        var entity = new Entity();

        var position = new Cartesian3(123456, 654321, 123456);
        var orientation = new Quaternion(1, 2, 3, 4);
        Quaternion.normalize(orientation, orientation);

        entity.position = new ConstantProperty(position);
        entity.orientation = new ConstantProperty(orientation);

        var modelMatrix = entity._getModelMatrix(new JulianDate());
        var expected = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation), position);
        expect(modelMatrix).toEqual(expected);
    });

    it('_getModelMatrix returns ENU when quaternion is undefined.', function() {
        var entity = new Entity();
        var position = new Cartesian3(123456, 654321, 123456);
        entity.position = new ConstantProperty(position);

        var modelMatrix = entity._getModelMatrix(new JulianDate());
        var expected = Transforms.eastNorthUpToFixedFrame(position);
        expect(modelMatrix).toEqual(expected);
    });

    it('_getModelMatrix works with result parameter.', function() {
        var entity = new Entity();
        var position = new Cartesian3(123456, 654321, 123456);
        entity.position = new ConstantProperty(position);

        var result = new Matrix4();
        var modelMatrix = entity._getModelMatrix(new JulianDate(), result);
        var expected = Transforms.eastNorthUpToFixedFrame(position);
        expect(modelMatrix).toBe(result);
        expect(modelMatrix).toEqual(expected);
    });

    it('can add and remove custom properties.', function() {
        var entity = new Entity();
        expect(entity.hasOwnProperty('bob')).toBe(false);
        entity.addProperty('bob');
        expect(entity.hasOwnProperty('bob')).toBe(true);
        entity.removeProperty('bob');
        expect(entity.hasOwnProperty('bob')).toBe(false);
    });

    it('addProperty throws with no property specified.', function() {
        var entity = new Entity();
        expect(function() {
            entity.addProperty(undefined);
        }).toThrowDeveloperError();
    });

    it('addProperty throws with no property specified.', function() {
        var entity = new Entity();
        expect(function() {
            entity.addProperty(undefined);
        }).toThrowDeveloperError();
    });

    it('removeProperty throws with no property specified.', function() {
        var entity = new Entity();
        expect(function() {
            entity.removeProperty(undefined);
        }).toThrowDeveloperError();
    });

    it('addProperty throws when adding an existing property.', function() {
        var entity = new Entity();
        entity.addProperty('bob');
        expect(function() {
            entity.addProperty('bob');
        }).toThrowDeveloperError();
    });

    it('removeProperty throws when non-existent property.', function() {
        var entity = new Entity();
        expect(function() {
            entity.removeProperty('bob');
        }).toThrowDeveloperError();
    });

    it('addProperty throws with defined reserved property name.', function() {
        var entity = new Entity();
        expect(function() {
            entity.addProperty('merge');
        }).toThrowDeveloperError();
    });

    it('removeProperty throws with defined reserved property name.', function() {
        var entity = new Entity();
        expect(function() {
            entity.removeProperty('merge');
        }).toThrowDeveloperError();
    });

    it('addProperty throws with undefined reserved property name.', function() {
        var entity = new Entity();
        expect(entity.name).toBeUndefined();
        expect(function() {
            entity.addProperty('name');
        }).toThrowDeveloperError();
    });

    it('removeProperty throws with undefined reserved property name.', function() {
        var entity = new Entity();
        expect(entity.name).toBeUndefined();
        expect(function() {
            entity.removeProperty('name');
        }).toThrowDeveloperError();
    });
});