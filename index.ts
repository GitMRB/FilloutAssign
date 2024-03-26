import express from "express";
import { Request, Response, NextFunction } from 'express';
import axios from "axios";

type FilterClauseType = {
	id: string;
	condition: 'equals' | 'does_not_equal' | 'greater_than' | 'less_than';
	value: number | string;
}

type ResponseFiltersType = FilterClauseType[];

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('This is a GET request at /');
});

app.get('/:formId/filteredResponses', async (req, res) => {
    const { formId } = req.params;
    const { filters } = req.query;
    let parsedFilters: FilterClauseType[];

    if (!filters) {
        return res.status(400).json({ error: 'No filters were provided.' });
    }

    if (typeof filters === 'string') {
        parsedFilters = JSON.parse(filters);
    } else {
        throw Error;
    }

    try {
        const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
            headers: {
                'Authorization': `Bearer ${process.env.BEARER_TOKEN}`
            }
        });

        const filteredResponses: ResponseFiltersType = response.data.responses.filter((response: { questions: any[]; }) => {
            return parsedFilters.every(filter => {
                const question = response.questions.find((q: { id: string; }) => q.id === filter.id);

                if (!question) return false;

                switch (filter.condition) {
                    case 'equals':
                        return question.value === filter.value;
                    case 'does_not_equal':
                        return question.value !== filter.value;
                    case 'greater_than':
                        return new Date(question.value) > new Date(filter.value);
                    case 'less_than':
                        return new Date(question.value) < new Date(filter.value);
                    default:
                        return false;
                }
            });
        });

        res.json({
            responses: filteredResponses,
            totalResponses: filteredResponses.length,
            pageCount: Math.ceil(filteredResponses.length / 10)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.toString() });
    }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send("Something is broken!");
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
