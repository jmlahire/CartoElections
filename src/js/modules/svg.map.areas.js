import * as d3Selection from 'd3-selection'
import * as d3Dispatch from 'd3-dispatch'
import * as d3Fetch from 'd3-fetch'
import * as d3Geo from 'd3-geo'
import {SvgMapLayer} from './svg.map.layer'
import {svgMapRegister} from "./svg.map.register";


const d3=Object.assign({},d3Selection,d3Geo,d3Dispatch,d3Fetch);




class SvgMapAreas extends SvgMapLayer {

    static type = 'SvgMapAreas';

    /**
     * CONSTRUCTEUR
     * @param id {String} : identifiant
     * @param options {Object} : options zoomable {Boolean} | autofit {Boolean} | clickable {Boolean} [ primary {String}
     * @returns {unknown}
     */
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
     * Colorie les areas
     * @param colorFn {Function} :
     * @returns {SvgMapLayer}
     */
    fill(colorFn){
        this.enqueue( () => new Promise((resolve, reject) => {
            this.container.selectAll("path")
                .each( (d,i,n) => {
                    const elt = d3.select(n[i]),
                        color = colorFn(d,this);
                    if (color && this.options.clickable) {
                        elt.style('fill', color)
                            .style('stroke', color)
                            .classed('clickable',true)
                            .on('click', (e,d)=>{
                                this.container.selectAll('path.area').classed('selected',false);
                                d3.select(e.target).classed('selected',true);
                                this.dispatch.call('click',this, { event:e, values:d.properties, id:d.properties[this.options.primary] });
                            })
                    }
                    else {
                        elt.style('fill', this.options.blank)
                            .classed('clickable',false)
                            .on('click', null)
                    }

                });
            resolve(this);
        }));
        return this;
    }
}


export {SvgMapAreas}