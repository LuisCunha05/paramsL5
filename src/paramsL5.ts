import { Limit } from '@/limit'
import { SearchCriteria } from '@/searchCriteria'
import { SearchJoin } from '@/searchJoin'

export class ParamsL5 {
	private params: string = ''
	private criteria: SearchCriteria
	private join: SearchJoin
	private limit: Limit

	constructor() {
		this.criteria = new SearchCriteria()
		this.join = new SearchJoin()
		this.limit = new Limit()
	}

	public toParams(): string {
		this.params = [
			this.join.toParams(),
			this.criteria.toParams(),
			this.limit.toParams(),
		].join('&')
		return this.params
	}
}
