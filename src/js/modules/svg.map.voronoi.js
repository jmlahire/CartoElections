import * as d3Selection from 'd3-selection'
import * as d3GeoVoronoi from 'd3-geo-voronoi';
import * as d3Dispatch from 'd3-dispatch';
import * as d3Scale from 'd3-scale'
import * as d3ScaleChromatic from 'd3-scale-chromatic'
import {SvgMapLayer} from './svg.map.layer.js'

import {DataCollection} from "./data.datacollection";
import {svgMapRegister} from "./svg.map.register";


const d3=Object.assign({},d3Selection,d3GeoVoronoi,d3Dispatch,d3Scale,d3ScaleChromatic);




class SvgMapVoronoi extends SvgMapLayer {

    static type = 'SvgMapVoronoi';

    constructor(id, options={}){
        const defaultOptions = { zoomable: true, autofit:false, clickable:true };
        options = { ...defaultOptions, ...options };
        super(id,options);
        svgMapRegister.add(id,this);
        Object.assign(this.state, { drawn:false });
        this.container=d3.create('svg:g')
            .attr('id',this.id)
            .classed('layer',true)
            .classed(options.className,options.className);
        if (options.clickable) this.dispatch=d3.dispatch("click");
    }

    /**
     * Charge un fichier topojson
     * @param file {String} : chemin et nom du fichier
     * @returns {SvgMapLayer}
     */
    load(file,options={}){
        const defaultOptions = { delimiter:',', primary:'id', lat:'lat', long:'long' };
        options= { ...defaultOptions, ...options };
        const dataMapper = (row) => {
            row[options.lat]=parseFloat(row[options.lat]);
            row[options.long]=parseFloat(row[options.long]);
            return row;
        }
        this.enqueue( () => new Promise((resolve, reject) => {
            const dataCollection =  new DataCollection().load(file, options),
                  vData=[];
            dataCollection.ready.then(()=> {
                dataCollection.each((row) => vData.push([row[options.long], row[options.lat], row[options.primary]]));
                const voronoi = d3.geoVoronoi(vData),
                    polygons = voronoi.polygons(),
                    {features} = polygons;
                this.geodata = features;
                this.options.primary=2;
                resolve(this.geodata);
            });

        }));
        return this;
    }

    /**
     * Extrait et renvoie l'identifiant d'un datum (utilisé notamment par les methodes draw et join)
     * @param d {Object} : FeatureCollection
     * @returns {String}
     * @private
     */
    _getId(d){
        return d.properties.site[2];
    }

    centroidsOLD(){
        this.enqueue( () => new Promise((resolve, reject) => {


            let centroids = this.geodata.map( (feature) => this.path.centroid(feature));
            console.log(this,centroids);
            let group=this.container.append('g').classed('centroids',true);
            group
                .selectAll('circle.centroid')
                .data(centroids)
                .enter()
                .append('circle')
                .classed('centroid',true)
                .attr('cx',d=>this.path(d[0]))
                .attr('cy',d=>d[0])
                .attr('r',2);

        }));
        return this;
    }

    centroids(){

        return this;
    }

    /**
     * Colorie les areas
     * @param key {String} :
     * @returns {SvgMapLayer}
     */
    fill(key){



        this.enqueue( () => new Promise((resolve, reject) => {
            let domain = [1.1,3.4],
                range = domain.map(d3.interpolateViridis),
                valueToColor = d3.scaleDiverging().domain(domain).interpolator(d3.interpolateViridis);
            const colorFn = d3.scaleDiverging(d3.interpolateViridis).domain([1.1,3.3]);

            this.container.selectAll("path.area")
                .each( (d,i,n) => {
                    const elt = d3.select(n[i]);
                    const id=this._getId(d);
                    let value=d.properties.mergedValue;
                    value=Array.isArray(value)?value[0][key]:null;

                    let color=valueToColor(value);
                    console.log(elt,value,color);
                    elt.attr('fill',color);


                });
            resolve(this);
        }));
        return this;
    }



}

export {SvgMapVoronoi}