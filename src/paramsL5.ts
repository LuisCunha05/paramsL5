import { SearchCriteria } from '@/searchCriteria'
import { SearchJoin } from '@/searchJoin'

export class ParamsL5 {
	private params: string = ''
	private criteria: SearchCriteria
	private join: SearchJoin

	constructor() {
		this.criteria = new SearchCriteria()
		this.join = new SearchJoin()
	}

	public toParams(): string {
		this.params = [this.join.toParams(), this.criteria.toParams()].join('&')
		return this.params
	}
}
