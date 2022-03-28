import * as d3Selection from 'd3-selection'
import * as d3Dispatch from 'd3-dispatch'
import * as d3Fetch from 'd3-fetch'
import * as d3Geo from 'd3-geo'
import {SvgMapLayer} from './svg.map.layer'


const d3=Object.assign({},d3Selection,d3Geo,d3Dispatch,d3Fetch);




class SvgMapPoints extends SvgMapLayer {

    static type = 'SvgMapPoints';

    /**
     * CONSTRUCTEUR
     * @param id {String} : identifiant
     * @param options {Object} : options zoomable {Boolean} | autofit {Boolean} | clickable {Boolean} [ primary {String}
     * @returns {unknown}
     */
    constructor(id, options={ clickable:true }){
        super(id,options);
    }

}


export {SvgMapPoints}