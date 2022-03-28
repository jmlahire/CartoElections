import * as d3Selection from 'd3-selection'
import * as d3Dispatch from 'd3-dispatch'
import * as d3Fetch from 'd3-fetch'
import * as d3Geo from 'd3-geo'
import * as topojson from 'topojson-client'
import {SvgComponent} from './svg.component.js'


const d3=Object.assign({},d3Selection,d3Geo,d3Dispatch,d3Fetch);


/**
 * Calque de carte générique
 */
class SvgMapLayer extends SvgComponent {

    static type = 'SvgMapLayer';

    /**
     * CONSTRUCTEUR
     * @param id {String} : identifiant
     * @param options {Object} : options zoomable {Boolean} | autofit {Boolean} | clickable {Boolean} [ primary {String}
     * @returns {unknown}
     */
    constructor(id, options={}){
        super(id,options);
        this.options=options;
    }

    /**
     * Renvoie la fonction path de la carte (commune à toutes les couches)
     * @returns {function}
     */
    get path(){
        return this.parentComponent.path || d3.geoMercator();
    }

    /**
     * Eznvoie la projection de la carte (commune à toutes les couches)
     * @returns {function}
     */
    get projection(){
        return this.parentComponent.projection || d3.geoPath();
    }


    /**
     * Charge un fichier topojson
     * @param file {String} : chemin et nom du fichier
     * @returns {SvgMapLayer}
     */
    load(file){
        this.enqueue( () => new Promise((resolve, reject) => {
            d3.json(file)
                .then( (topology) => {
                    this.geodata = topojson.feature(topology, Object.getOwnPropertyNames(topology.objects)[0]).features;
                    resolve(this.geodata);
                })
        }));
        return this;
    }

    /**
     * Injecte directement un objet FeatureCollection (format topojson)
     * @param FeatureCollection {Object}
     * @returns {SvgMapLayer}
     */
    push(FeatureCollection){
        this.enqueue( () => new Promise((resolve, reject) => {
            this.geodata = FeatureCollection;
            resolve(this.geodata);
        }));
        return this;
    }

    /**
     * Dessine les contours de la couche
     * @returns {SvgMapLayer}
     */
    draw(){
        this.enqueue( () => new Promise((resolve, reject) => {
            //Autozoom
            if (this.options.autofit)
                this.projection.fitExtent([[0,0], [this.parentComponent.size.effectiveWidth, this.parentComponent.size.effectiveHeight]], {type:"FeatureCollection", features: this.geodata});
            //Generateur de classes
            const classGenerator = (this.options.primary) ? (d) => '_'+this._getId(d) : '';
            //Tracé
            this.path.projection(this.projection);
            const paths = this.container
                                .append('g')
                                    .classed('areas',true)
                                    .selectAll("path")
                                    .data(this.geodata)
                                    .enter()
                                    .append('path')
                                        .attr('class', classGenerator )
                                        .classed('area',true)
                                        .attr('d', this.path);
            //Clic
            if (this.options.clickable) {
                paths.on('click', (e,d) => this.dispatch.call('click',this, { event:e, values:d.properties, id:d.properties[this.options.primary]}));
                this.container.style('pointer-events','visiblePainted');
            }
            else {
                paths.on('click',null);
                this.container.style('pointer-events','none');
            }
            //Zoom
            if (this.options.zoomable) this.parentComponent.zoomable(true);
            //Statut
            this.state.drawn=true;
            resolve(this);
        }))
        return this;
    }

    /**
     * Extrait et renvoie l'identifiant d'un datum
     * @param d {Object} : FeatureCollection
     * @returns {String}
     * @private
     */
    _getId(d){
        return d.properties[this.options.primary];
    }


    /**
     * Zoome sur la couche (à tester)
     * @returns {SvgMapLayer}
     */
    zoomOn(){
        this.parentComponent.zoomTo(d3.select(`g#${this.id}`));
        return this;
    }

    /**
     * Ajoute des données par jointure
     * @param dataCollection {DataCollection} : données
     * @param dataKey {String} : clé primaire des données (par défaut: celle définie dans dataCollection)
     * @param geoKey {String} : clé primaire des entités géo (par défaut, celle définie dans l'instance)
     * @returns {SvgMapLayer}
     */
    join(dataCollection, dataKey, geoKey){
        geoKey = geoKey || this.options.primary;
        dataKey = dataKey || dataCollection.primaryKey || 'id';
        this.enqueue( () => new Promise((resolve, reject) => {
            dataCollection.ready.then( ()=> {
                const data=dataCollection.exportToMap(dataKey);
                this.container.selectAll("path")
                    .each( (d,i,n) => {
                        //const   elt = d3.select(n[i]),
                        const   id = this._getId(d);
                        d.properties.mergedValue= data.get(id);
                    });
                resolve(this);
            });
        }));
        return this;
    }





    labels(dataCollection,dataKey,labelKey, options){
        options={...{ delay:1500, duration:1000},...options };
        this.enqueue( () => new Promise((resolve, reject) => {
            dataCollection.ready.then( (data)=> {
                const list=data.exportToMap(dataKey);
                this.labelContainer=this.innerContainer.append('g').attr('class','labels');
                this.container.selectAll('path.area')
                    .each((d) => {
                        const pref=list.get(d.properties[this.options.primary]);
                        if (pref) {
                            const center=this.path.centroid(d);
                            this.labelContainer.append('text')
                                .attr('class','label')
                                .attr('x',center[0])
                                .attr('y',center[1])
                                .transition()
                                .delay(options.delay)

                                .duration(options.duration)

                                .attr('font-size',24)
                                .text(pref[0][labelKey])
                                .on('end', ()=> resolve(this));

                        }
                    });
            })


        }));
        return this;
    }

    clip(mapClip=null){
        const value = (mapClip instanceof SvgMapLayer) ? `url(#${mapClip.id})` : null;
        this.outerContainer.attr('clip-path', value);
        return this;
    }






}
export {SvgMapLayer}