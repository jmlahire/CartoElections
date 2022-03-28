import * as d3Selection from 'd3-selection'
import {SvgComponent} from './svg.component.js'
import {SvgMapComposition} from './svg.map.composition.js'
import {SvgMapLayer} from './svg.map.layer.js'
import {componentsRegister, idGenerator} from "./common.components";


const d3=Object.assign({},d3Selection);




class SvgMapClip extends SvgMapLayer {

    static type = 'SvgMapClip';

    constructor(id){
        super(id);
        this.container=d3.create('svg:clipPath')
            .attr('id',this.id);
    }

    appendTo(parent) {
        console.log(parent);
        if (parent instanceof SvgMapComposition){
            this.parentComponent=parent;
            this.parentContainer=parent.outerContainer.select('defs');
            this.parentContainer.append(() => this.outerContainer.node());
        }
        return this;
    }

    draw(){
        this.enqueue( () => new Promise((resolve, reject) => {
            this.path.projection(this.projection);
            this.container
                    .selectAll("path")
                    .data(this.geodata)
                    .enter()
                    .append('path')
                    .attr('d', this.path);
            resolve(this);
        }));
        return this;
    }
}



export {SvgMapClip}