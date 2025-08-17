// components/property-card/property-card.ts
import { Property } from '../../types/models';

Component({
    properties: {
        item: {
            type: Object,
            value: {} as Property,
        },
    },
    methods: {
        onCardTap() {
            this.triggerEvent('tap', { propertyId: this.data.item.property_id })
        }
    }
});