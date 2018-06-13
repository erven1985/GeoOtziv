let myMap, 
    clusterer,
    form, 
    name,
    place,
    review, 
    list;

const cache = new Map();

const geocode = (address) => {
    if (cache.has(address)) {
        return Promise.resolve(cache.get(address));
    }

    return ymaps.geocode(address)
        .then(result => {
            const points = result.geoObjects.toArray();

            if (points.length) {
                const coors = points[0].geometry.getCoordinates();
                cache.set(address, coors);
                return coors;
            }
        });
};

new Promise(resolve => ymaps.ready(resolve))
    .then(() => {
        myMap = new ymaps.Map('map', {
            center: [55.76, 37.64],
            zoom: 5
        }, {
            searchControlProvider: 'yandex#search'
        });
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: false
        });

        myMap.geoObjects.add(clusterer);

    })
    .then(() => {
        OnMapClick()
    });

    const getAddress = (coords) => {
    
    return ymaps.geocode(coords).then((res) => {
        
        let address,
            firstGeoObject = res.geoObjects.get(0);

        address = firstGeoObject.getAddressLine();

        return address;
    });
};

const OnMapClick = () => {
    myMap.events.add('click', (e) => {
        if (!myMap.balloon.isOpen()) {
        const latlong = e.get('coords');
        const addressPromise = getAddress(latlong);

        addressPromise.then(address => {
            let data = {
                latlong: latlong,
                address: address
            };
            openBalloon(data)

        });

        } else {
            myMap.balloon.close();
        }
         
        })
};

const createPlaceMarker = (data) => {
    let latlong = data.latlong ? data.latlong : data.geometry.getCoordinates(),
        placeMarker = new ymaps.Placemark(latlong, {
            data: data
        },{
            balloonShadow: false,
            balloonLayout: setBalloonLayout(),
            balloonContentLayout: createBalloonHTML(data),
            balloonPanelMaxMapArea: 0,
            hideIconOnBalloonOpen: true,
            preset: 'islands#violetIcon'
        });

    return placeMarker;
};

const setBalloonLayout = () => {
    const balloonLayout = ymaps.templateLayoutFactory.createClass(
        '$[[options.contentLayout]]',
        {
            build: function () {
                this.constructor.superclass.build.call(this);

                const baloonEl = this.getParentElement().querySelector('.main-div'),
                      close = baloonEl.querySelector('.close'),
                      that = this;

                close.addEventListener('click', (e) => {
                    e.preventDefault();
                    that.events.fire('userclose');
                });
            }
        }
    );

    return balloonLayout;
};

const createBalloonHTML = (data) => {
    if(!data.address) {
        data.address = getAddress(data.latlong);
    }
    let baloonHTML = `<div class="main-div"><div class="header"><span class="page-header"><i class="fa fa-map-marker fa-lg"></i> ${data.address.length > 35 ? data.address.slice(0, 32)+'...' : data.address }</span><button type="button" class="close">&times;</button></div><div class="body"><ul id="list"></ul><div class="add-review-form"><h2 class="form-header">Ваш отзыв</h2><input id="username" class="form-control" placeholder="Ваше имя"><input id="place" class="form-control" placeholder="Укажите место"><textarea id="review" class="form-control" rows="5" placeholder="Поделитесь впечатлениями"></textarea><button class="btn" id="submitBtn" onclick="createReview()">Добавить</button></div></div></div>`;
    let balloonContentLayout = ymaps.templateLayoutFactory.createClass(baloonHTML);

    return balloonContentLayout;
};

const openBalloon = (data) => {
    myMap.balloon.open(data.latlong, data, {
        closeButton: false,
        layout: setBalloonLayout(),
        contentLayout: createBalloonHTML(data)
    });
};

const createReview = () => {
    form    =   document.querySelector('.add-review-form'),
    name    =   document.querySelector('#username'), 
    place   =   document.querySelector('#place'), 
    review  =   document.querySelector('#review'),
    list    =   document.querySelector('#list');

    checkInput(name);
    checkInput(place);   
    checkInput(review);

    if(name.classList.contains('error') || place.classList.contains('error') || review.classList.contains('error')) return;

    const date = getDate();
    addReview(name,place,review, date);

    const data = myMap.balloon.getData();
    
    const newData = {
        latlong: data.latlong ? data.latlong : data.geometry.getCoordinates(),
        address: data.address
    };
    const placemarker = createPlaceMarker(newData);

    clusterer.add(placemarker);

    clearForm();
        

};


const checkInput = (input) => {
    !input.value ? input.classList.add("error") : input.classList.remove("error");
}

const clearForm = () => {
    name.value   = "";
    place.value  = "";
    review.value = "";
};

const getDate = () => {
    let d = new Date(),
        h = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours(),
        m = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes(),
        day = d.getDay() < 10 ? `0${d.getDay()}` : d.getDay(),
        month = d.getMonth() < 10 ? `0${d.getMonth()}` : d.getMonth(),
        year = d.getFullYear();
    let date = `${day}-${month}-${year} ${h}:${m}`

    return date;
};

const addReview = (name,place,review,date) => {
    console.log(name, place, review, list)
    const li = document.createElement('li');
    li.classList.add('list-item');
    li.innerHTML = `<b>${name.value}</b> ${place.value} ${date}</br>${review.value}`;
    list.appendChild(li)
};